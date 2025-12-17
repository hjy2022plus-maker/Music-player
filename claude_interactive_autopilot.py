import subprocess
import time
import sys

def run_autopilot(commands):
    # 启动 Claude Code（交互模式）
    proc = subprocess.Popen(
        ["claude"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    def send(cmd):
        print(f"\n>>> SEND: {cmd}")
        proc.stdin.write(cmd + "\n")
        proc.stdin.flush()
        time.sleep(1)

    try:
        # 等 Claude REPL 启动
        time.sleep(3)

        for cmd in commands:
            send(cmd)
            time.sleep(3)

        # 给 Claude 一点时间执行
        time.sleep(5)

    finally:
        send("/exit")
        proc.terminate()


if __name__ == "__main__":
    commands = [
        "/init",
        "Create a file named CLAUDE.md in the project root and write full project documentation into it.",
    ]

    run_autopilot(commands)
