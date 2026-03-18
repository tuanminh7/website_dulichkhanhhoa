#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from queue import Empty, Queue
from threading import Thread
from typing import Iterable, Optional, TextIO


ANSI_ESCAPE_RE = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
DOCKER_LOG_PREFIX_RE = re.compile(r"^(?:[a-zA-Z0-9_.-]+-\d+)\s+\|\s?(?P<message>.*)$")
ACCESS_LOG_RE = re.compile(
    r'^(?P<ip>\S+)\s+-\s+-\s+\[(?P<timestamp>[^\]]+)\]\s+"(?P<method>[A-Z]+)\s+'
    r'(?P<path>\S+)(?:\s+HTTP/(?P<http_version>[^"]+))?"\s+(?P<status>\d{3})\s+(?P<size>\S+)'
)
CHAT_EVENT_RE = re.compile(r"CHAT_EVT\s+(?P<payload>\{.*\})")
LEVEL_RE = re.compile(r"\b(DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL)\b")
TIMESTAMP_RE = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:,\d+)?|\d{1,2}/[A-Za-z]{3}/\d{4}\s+\d{2}:\d{2}:\d{2})"
)


@dataclass
class ParsedLine:
    raw: str
    clean: str
    line_no: int
    kind: str
    ip: Optional[str] = None
    timestamp: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    status: Optional[int] = None
    level: Optional[str] = None
    event_name: Optional[str] = None
    event_payload: Optional[dict] = None


@dataclass
class ReportState:
    total_lines: int
    matched_lines: int
    access_lines: int
    app_lines: int
    request_count: int
    levels: Counter
    methods: Counter
    statuses: Counter
    status_classes: Counter
    endpoints: Counter
    ips: Counter
    app_messages: Counter
    chat_events: Counter
    image_events: Counter
    stream_events: Counter
    matched_examples: list[dict]


def new_report_state() -> ReportState:
    return ReportState(
        total_lines=0,
        matched_lines=0,
        access_lines=0,
        app_lines=0,
        request_count=0,
        levels=Counter(),
        methods=Counter(),
        statuses=Counter(),
        status_classes=Counter(),
        endpoints=Counter(),
        ips=Counter(),
        app_messages=Counter(),
        chat_events=Counter(),
        image_events=Counter(),
        stream_events=Counter(),
        matched_examples=[],
    )


def strip_ansi(text: str) -> str:
    return ANSI_ESCAPE_RE.sub("", text)


def strip_log_prefix(text: str) -> str:
    docker_match = DOCKER_LOG_PREFIX_RE.match(text)
    if docker_match:
        return docker_match.group("message")
    return text


def normalize_level(level: Optional[str]) -> Optional[str]:
    if not level:
        return None
    return "WARNING" if level == "WARN" else level


def classify_status(status: int) -> str:
    return f"{status // 100}xx"


def normalize_path(path: str) -> str:
    if not path:
        return path
    return path.split("?", 1)[0]


def parse_line(raw_line: str, line_no: int) -> ParsedLine:
    clean = strip_log_prefix(strip_ansi(raw_line.rstrip("\n")))
    access_match = ACCESS_LOG_RE.match(clean)
    if access_match:
        status = int(access_match.group("status"))
        return ParsedLine(
            raw=raw_line.rstrip("\n"),
            clean=clean,
            line_no=line_no,
            kind="access",
            ip=access_match.group("ip"),
            timestamp=access_match.group("timestamp"),
            method=access_match.group("method"),
            path=access_match.group("path"),
            status=status,
            level="ERROR" if status >= 500 else "WARNING" if status >= 400 else "INFO",
        )

    chat_event_match = CHAT_EVENT_RE.search(clean)
    level_match = LEVEL_RE.search(clean)
    timestamp_match = TIMESTAMP_RE.search(clean)
    event_payload = None
    event_name = None
    path = None
    if chat_event_match:
        try:
            event_payload = json.loads(chat_event_match.group("payload"))
            event_name = event_payload.get("event")
            path = event_payload.get("path")
        except json.JSONDecodeError:
            event_payload = None

    return ParsedLine(
        raw=raw_line.rstrip("\n"),
        clean=clean,
        line_no=line_no,
        kind="app",
        timestamp=timestamp_match.group("timestamp") if timestamp_match else None,
        level=normalize_level(level_match.group(1)) if level_match else None,
        path=path,
        event_name=event_name,
        event_payload=event_payload,
    )


def iter_lines(path: Path, encoding: str) -> Iterable[str]:
    with path.open("r", encoding=encoding, errors="replace") as handle:
        yield from handle


def update_state(
    state: ReportState,
    parsed: ParsedLine,
    keyword_lower: Optional[str] = None,
    level: Optional[str] = None,
    status: Optional[int] = None,
) -> None:
    state.total_lines += 1

    if parsed.kind == "access":
        state.access_lines += 1
    else:
        state.app_lines += 1

    if keyword_lower and keyword_lower not in parsed.clean.lower():
        return
    if level and parsed.level != level:
        return
    if status is not None and parsed.status != status:
        return

    state.matched_lines += 1

    if parsed.level:
        state.levels[parsed.level] += 1

    if parsed.kind == "access":
        state.request_count += 1
        if parsed.method:
            state.methods[parsed.method] += 1
        if parsed.status is not None:
            state.statuses[str(parsed.status)] += 1
            state.status_classes[classify_status(parsed.status)] += 1
        if parsed.path:
            state.endpoints[normalize_path(parsed.path)] += 1
        if parsed.ip:
            state.ips[parsed.ip] += 1
    else:
        state.app_messages[parsed.clean] += 1
        if parsed.event_name:
            state.chat_events[parsed.event_name] += 1
            if parsed.path:
                state.endpoints[normalize_path(parsed.path)] += 1
            if parsed.event_name.startswith("client_image_") or parsed.event_name.startswith("image_") or parsed.event_name == "chat_images_injected":
                state.image_events[parsed.event_name] += 1
            if parsed.event_name.startswith("chat_stream_") or parsed.event_name in {
                "chat_completed",
                "chat_cache_hit",
                "client_stream_missing_done",
            }:
                state.stream_events[parsed.event_name] += 1

    if len(state.matched_examples) < 10:
        state.matched_examples.append(
            {
                "line_no": parsed.line_no,
                "kind": parsed.kind,
                "level": parsed.level,
                "status": parsed.status,
                "event": parsed.event_name,
                "message": parsed.clean,
            }
        )


def finalize_report(
    state: ReportState,
    log_path: Path,
    encoding: str,
    keyword: Optional[str],
    level: Optional[str],
    status: Optional[int],
    limit: int,
) -> dict:
    return {
        "file": str(log_path),
        "encoding": encoding,
        "filters": {
            "keyword": keyword,
            "level": level,
            "status": status,
        },
        "summary": {
            "total_lines": state.total_lines,
            "matched_lines": state.matched_lines,
            "access_lines": state.access_lines,
            "app_lines": state.app_lines,
            "request_count": state.request_count,
        },
        "levels": dict(state.levels.most_common(limit)),
        "methods": dict(state.methods.most_common(limit)),
        "statuses": dict(state.statuses.most_common(limit)),
        "status_classes": dict(state.status_classes.most_common(limit)),
        "top_endpoints": dict(state.endpoints.most_common(limit)),
        "top_ips": dict(state.ips.most_common(limit)),
        "chat_events": dict(state.chat_events.most_common(limit)),
        "image_events": dict(state.image_events.most_common(limit)),
        "stream_events": dict(state.stream_events.most_common(limit)),
        "top_app_messages": dict(state.app_messages.most_common(limit)),
        "examples": state.matched_examples,
    }


def build_report(
    log_path: Path,
    encoding: str = "utf-8",
    keyword: Optional[str] = None,
    level: Optional[str] = None,
    status: Optional[int] = None,
    limit: int = 10,
) -> dict:
    state = new_report_state()
    level = normalize_level(level.upper()) if level else None
    keyword_lower = keyword.lower() if keyword else None

    for line_no, raw_line in enumerate(iter_lines(log_path, encoding), start=1):
        parsed = parse_line(raw_line, line_no)
        update_state(state, parsed, keyword_lower=keyword_lower, level=level, status=status)

    return finalize_report(state, log_path, encoding, keyword, level, status, limit)


def build_report_from_stream(
    stream: TextIO,
    source_name: str,
    encoding: str = "utf-8",
    keyword: Optional[str] = None,
    level: Optional[str] = None,
    status: Optional[int] = None,
    limit: int = 10,
) -> dict:
    state = new_report_state()
    normalized_level = normalize_level(level.upper()) if level else None
    keyword_lower = keyword.lower() if keyword else None

    for line_no, raw_line in enumerate(stream, start=1):
        parsed = parse_line(raw_line, line_no)
        update_state(state, parsed, keyword_lower=keyword_lower, level=normalized_level, status=status)

    return finalize_report(
        state,
        Path(source_name),
        encoding,
        keyword,
        normalized_level,
        status,
        limit,
    )


def print_human_report(report: dict, header: Optional[str] = None) -> None:
    summary = report["summary"]
    if header:
        print(header)
    print(f"Log file: {report['file']}")
    print(f"Total lines: {summary['total_lines']}")
    print(f"Matched lines: {summary['matched_lines']}")
    print(f"Access lines: {summary['access_lines']}")
    print(f"App lines: {summary['app_lines']}")
    print(f"Requests: {summary['request_count']}")

    for title, key in (
        ("Levels", "levels"),
        ("Methods", "methods"),
        ("Statuses", "statuses"),
        ("Status classes", "status_classes"),
        ("Top endpoints", "top_endpoints"),
        ("Top IPs", "top_ips"),
        ("Chat events", "chat_events"),
        ("Image events", "image_events"),
        ("Stream events", "stream_events"),
        ("Top app messages", "top_app_messages"),
    ):
        data = report[key]
        if not data:
            continue
        print(f"\n{title}:")
        for item, count in data.items():
            print(f"  {item}: {count}")

    if report["examples"]:
        print("\nExamples:")
        for example in report["examples"]:
            prefix = f"  [line {example['line_no']}]"
            print(f"{prefix} {example['message']}")


def enqueue_stream_lines(stream: TextIO, queue: Queue) -> None:
    try:
        for line in stream:
            queue.put(line)
    finally:
        queue.put(None)


def print_watch_snapshot(
    state: ReportState,
    source_name: str,
    encoding: str,
    keyword: Optional[str],
    level: Optional[str],
    status: Optional[int],
    limit: int,
    refresh_interval: float,
    poll_interval: float,
    clear_screen: bool,
) -> None:
    report = finalize_report(
        state,
        Path(source_name),
        encoding,
        keyword,
        level,
        status,
        limit,
    )
    if clear_screen:
        os.system("cls" if os.name == "nt" else "clear")
    print_human_report(
        report,
        header=f"Watching log live. Refresh: {refresh_interval:.1f}s | Poll: {poll_interval:.1f}s",
    )
    print("\nPress Ctrl+C to stop.")


def watch_log(
    log_path: Path,
    encoding: str = "utf-8",
    keyword: Optional[str] = None,
    level: Optional[str] = None,
    status: Optional[int] = None,
    limit: int = 10,
    refresh_interval: float = 5.0,
    poll_interval: float = 1.0,
    start_at_end: bool = False,
    clear_screen: bool = False,
) -> int:
    normalized_level = normalize_level(level.upper()) if level else None
    keyword_lower = keyword.lower() if keyword else None
    state = new_report_state()
    last_refresh = 0.0
    line_no = 0
    position = 0

    if start_at_end and log_path.exists():
        position = log_path.stat().st_size

    while True:
        if log_path.exists():
            current_size = log_path.stat().st_size
            if current_size < position:
                position = 0
                line_no = 0
                state = new_report_state()

            with log_path.open("r", encoding=encoding, errors="replace") as handle:
                handle.seek(position)
                for line in handle:
                    line_no += 1
                    parsed = parse_line(line, line_no)
                    update_state(
                        state,
                        parsed,
                        keyword_lower=keyword_lower,
                        level=normalized_level,
                        status=status,
                    )
                position = handle.tell()

        now = time.time()
        if now - last_refresh >= refresh_interval:
            print_watch_snapshot(
                state=state,
                source_name=str(log_path),
                encoding=encoding,
                keyword=keyword,
                level=normalized_level,
                status=status,
                limit=limit,
                refresh_interval=refresh_interval,
                poll_interval=poll_interval,
                clear_screen=clear_screen,
            )
            last_refresh = now

        time.sleep(poll_interval)


def watch_stream(
    stream: TextIO,
    source_name: str,
    encoding: str = "utf-8",
    keyword: Optional[str] = None,
    level: Optional[str] = None,
    status: Optional[int] = None,
    limit: int = 10,
    refresh_interval: float = 5.0,
    poll_interval: float = 1.0,
    clear_screen: bool = False,
) -> int:
    normalized_level = normalize_level(level.upper()) if level else None
    keyword_lower = keyword.lower() if keyword else None
    state = new_report_state()
    line_no = 0
    last_refresh = 0.0
    queue: Queue[Optional[str]] = Queue()
    reader = Thread(target=enqueue_stream_lines, args=(stream, queue), daemon=True)
    reader.start()

    while True:
        try:
            item = queue.get(timeout=poll_interval)
        except Empty:
            now = time.time()
            if now - last_refresh >= refresh_interval:
                print_watch_snapshot(
                    state=state,
                    source_name=source_name,
                    encoding=encoding,
                    keyword=keyword,
                    level=normalized_level,
                    status=status,
                    limit=limit,
                    refresh_interval=refresh_interval,
                    poll_interval=poll_interval,
                    clear_screen=clear_screen,
                )
                last_refresh = now
            continue

        if item is None:
            print_watch_snapshot(
                state=state,
                source_name=source_name,
                encoding=encoding,
                keyword=keyword,
                level=normalized_level,
                status=status,
                limit=limit,
                refresh_interval=refresh_interval,
                poll_interval=poll_interval,
                clear_screen=clear_screen,
            )
            return 0

        line_no += 1
        parsed = parse_line(item, line_no)
        update_state(
            state,
            parsed,
            keyword_lower=keyword_lower,
            level=normalized_level,
            status=status,
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Analyze Flask/Gunicorn style server logs and summarize traffic/errors."
    )
    parser.add_argument("logfile", help="Path to the log file to analyze, or '-' to read from stdin.")
    parser.add_argument("--encoding", default="utf-8", help="Text encoding for the log file.")
    parser.add_argument("--keyword", help="Only include lines containing this keyword.")
    parser.add_argument(
        "--level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Only include lines at this log level.",
    )
    parser.add_argument("--status", type=int, help="Only include access log lines with this HTTP status code.")
    parser.add_argument("--top", type=int, default=10, help="Number of top items to show per section.")
    parser.add_argument("--json", action="store_true", help="Output the report as JSON.")
    parser.add_argument("--output", help="Optional path to save the JSON report.")
    parser.add_argument("--watch", action="store_true", help="Keep watching the log file and refresh stats live.")
    parser.add_argument(
        "--from-end",
        action="store_true",
        help="With --watch, start from the end of the file and only process new lines.",
    )
    parser.add_argument("--refresh", type=float, default=5.0, help="With --watch, refresh summary every N seconds.")
    parser.add_argument("--poll", type=float, default=1.0, help="With --watch, check for new log lines every N seconds.")
    parser.add_argument("--clear", action="store_true", help="With --watch, clear the screen before each refresh.")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    use_stdin = args.logfile == "-"
    log_path = None if use_stdin else Path(args.logfile)
    if not use_stdin and not log_path.exists():
        parser.error(f"Log file not found: {log_path}")

    if args.watch:
        if args.json:
            parser.error("--json is not supported together with --watch")
        if use_stdin:
            if args.from_end:
                parser.error("--from-end is only supported when watching a file")
            try:
                return watch_stream(
                    stream=sys.stdin,
                    source_name="stdin",
                    encoding=args.encoding,
                    keyword=args.keyword,
                    level=args.level,
                    status=args.status,
                    limit=args.top,
                    refresh_interval=args.refresh,
                    poll_interval=args.poll,
                    clear_screen=args.clear,
                )
            except KeyboardInterrupt:
                print("\nStopped watching log stream.")
                return 0
        try:
            return watch_log(
                log_path=log_path,
                encoding=args.encoding,
                keyword=args.keyword,
                level=args.level,
                status=args.status,
                limit=args.top,
                refresh_interval=args.refresh,
                poll_interval=args.poll,
                start_at_end=args.from_end,
                clear_screen=args.clear,
            )
        except KeyboardInterrupt:
            print("\nStopped watching log file.")
            return 0

    if use_stdin:
        report = build_report_from_stream(
            stream=sys.stdin,
            source_name="stdin",
            encoding=args.encoding,
            keyword=args.keyword,
            level=args.level,
            status=args.status,
            limit=args.top,
        )
    else:
        report = build_report(
            log_path=log_path,
            encoding=args.encoding,
            keyword=args.keyword,
            level=args.level,
            status=args.status,
            limit=args.top,
        )

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_human_report(report)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
