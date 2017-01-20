#!/usr/bin/env python

import sys
import getopt
import subprocess
import os
import pwd


def usage():
    print '\nUsage: ' + sys.argv[0] + ' -w <webport>\n'
    # print '\nUsage: ' + sys.argv[0] + ' -m <mongohost> -p <mongoport> -w <webport>\n'


def get_username():
    return pwd.getpwuid(os.getuid())[0]


def main(argv):
    mongohost = ''
    mongoport = ''
    webport = ''
    try:
        opts, args = getopt.getopt(argv, "hw:", ["webport="])
        # opts, args = getopt.getopt(argv, "hm:p:w:", ["mongohost=", "mongoport=", "webport="])
    except getopt.GetoptError:
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            usage()
            sys.exit()
        # elif opt in ("-m", "--mongohost"):
            # mongohost = arg
        # elif opt in ("-p", "--mongoport"):
            # mongoport = arg
        elif opt in ("-w", "--webport"):
            webport = arg

    # print 'mongohost is ', mongohost
    # print 'mongoport is ', mongoport
    print 'webport is ', webport

    if webport == '':
        usage()
        sys.exit()

    user = get_username()
    run_cmd = "docker run -p " + webport + ":3000 --name " + user + "-findapi -d sbubmi/findapi"
    print run_cmd
    subprocess.call(run_cmd, shell=True)


if __name__ == "__main__":
    main(sys.argv[1:])
