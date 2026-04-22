#!/usr/bin/env python3

import sys
import getopt
import subprocess
import os
import pwd
import re


def usage():
    print("\nUsage: " + sys.argv[0] + " -m <mongohost> -p <mongoport> -w <webport>\n")


def get_username():
    return pwd.getpwuid(os.getuid())[0]


def validate_host(value):
    pattern = re.compile(r"^[a-zA-Z0-9._-]+$")
    if not pattern.match(value):
        print("ERROR: invalid hostname: " + value, file=sys.stderr)
        sys.exit(1)
    return value


def validate_port(value):
    if not value.isdigit() or not (1 <= int(value) <= 65535):
        print("ERROR: invalid port: " + value, file=sys.stderr)
        sys.exit(1)
    return value


def main(argv):
    mongohost = ""
    mongoport = ""
    webport = ""
    try:
        opts, args = getopt.getopt(argv, "hm:p:w:", ["mongohost=", "mongoport=", "webport="])
    except getopt.GetoptError:
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt == "-h":
            usage()
            sys.exit()
        elif opt in ("-m", "--mongohost"):
            mongohost = arg
        elif opt in ("-p", "--mongoport"):
            mongoport = arg
        elif opt in ("-w", "--webport"):
            webport = arg

    if not webport or not mongoport or not mongohost:
        usage()
        sys.exit(1)

    mongohost = validate_host(mongohost)
    mongoport = validate_port(mongoport)
    webport = validate_port(webport)

    user = get_username()

    run_cmd = [
        "docker", "run",
        "-e", "MONHOST=" + mongohost,
        "-e", "MONPORT=" + mongoport,
        "-p", webport + ":3000",
        "--name", user + "-findapi",
        "-d", "sbubmi/findapi"
    ]
    subprocess.call(run_cmd)


if __name__ == "__main__":
    main(sys.argv[1:])
