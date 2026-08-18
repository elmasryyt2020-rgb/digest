import paramiko
import sys

host = "41.33.93.209"
port = 2222
user = "seif"
password = "Gothi2027"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, port=port, username=user, password=password, timeout=10)
sftp = ssh.open_sftp()

local_file = "d:/digest/supabase/functions/generate-meal-plan/index.ts"
remote_file = "/home/seif/supabase-docker/volumes/functions/generate-meal-plan/index.ts"

print("Uploading", local_file, "->", remote_file)
sftp.put(local_file, remote_file)
print("UPLOAD COMPLETE!")

sftp.close()
ssh.close()
