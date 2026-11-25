"""Serve the built static site locally and accept the preview runner's flags."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=3000, type=int)
    parser.add_argument("--strictPort", action="store_true", help="fail if the port is already in use")
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent.parent / "dist"
    handler = partial(SimpleHTTPRequestHandler, directory=directory)
    with ThreadingHTTPServer((args.host, args.port), handler) as server:
        print(f"Listening at http://{args.host}:{args.port}", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
