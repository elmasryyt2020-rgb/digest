import os
import sys
import paramiko

PASSWORD = "Gothi2027"

def main():
    print("Connecting to VPS...", flush=True)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname="41.33.93.209",
        port=2222,
        username="seif",
        password=PASSWORD,
        timeout=15
    )
    print("Connected!", flush=True)
    sftp = client.open_sftp()
    
    local_base = os.path.abspath("supabase/functions")
    remote_base = "/home/seif/supabase-docker/volumes/functions"
    
    for root, dirs, files in os.walk(local_base):
        rel = os.path.relpath(root, local_base)
        if rel == ".":
            rem_dir = remote_base
        else:
            rem_dir = (remote_base + "/" + rel).replace("\\", "/")
            try:
                sftp.mkdir(rem_dir)
            except Exception:
                pass
        for f in files:
            loc = os.path.join(root, f)
            rem = f"{rem_dir}/{f}"
            print(f"Uploading {f} to {rem}...", flush=True)
            sftp.put(loc, rem)
            
    sftp.close()
    client.close()
    print("ALL FUNCTIONS SYNCED!", flush=True)

if __name__ == "__main__":
    main()
