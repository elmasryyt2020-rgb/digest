import sys
import os
import paramiko

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PASSWORD = "Gothi2027"

def get_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname="41.33.93.209",
        port=2222,
        username="seif",
        password=PASSWORD,
        timeout=30
    )
    return client

def run_cmd(cmd, sudo=False):
    client = get_client()
    try:
        if sudo:
            cmd = f"echo '{PASSWORD}' | sudo -S {cmd}"
        stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
        out = stdout.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        print(f"=== EXIT CODE: {code} ===")
        if out:
            print("=== OUTPUT ===")
            print(out.encode("ascii", "replace").decode("ascii"))
        return code, out
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ssh_runner.py <cmd> | --sudo <cmd>")
        sys.exit(1)
    
    if sys.argv[1] == "--sudo":
        run_cmd(" ".join(sys.argv[2:]), sudo=True)
    else:
        run_cmd(" ".join(sys.argv[1:]))
