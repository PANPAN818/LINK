#!/bin/sh
set -eu

deploy_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$deploy_dir"
test -f .env
mkdir -p private
umask 077

password=''
restore_terminal() {
  stty echo 2>/dev/null || true
  unset password
}
trap restore_terminal EXIT INT TERM
printf '请输入机器人 QQ 密码（输入不会显示）: ' >&2
stty -echo
IFS= read -r password
stty echo
printf '\n' >&2
test -n "$password"
password_md5=$(printf '%s' "$password" | openssl dgst -md5 -r | awk '{print $1}')
unset password

temporary_file=$(mktemp "$deploy_dir/private/napcat-env.XXXXXX")
found_plain=false
found_md5=false
while IFS= read -r line || test -n "$line"; do
  case "$line" in
    NAPCAT_QUICK_PASSWORD=*)
      printf 'NAPCAT_QUICK_PASSWORD=\n' >> "$temporary_file"
      found_plain=true
      ;;
    NAPCAT_QUICK_PASSWORD_MD5=*)
      printf 'NAPCAT_QUICK_PASSWORD_MD5=%s\n' "$password_md5" >> "$temporary_file"
      found_md5=true
      ;;
    *) printf '%s\n' "$line" >> "$temporary_file" ;;
  esac
done < .env
if test "$found_plain" = false; then printf '\nNAPCAT_QUICK_PASSWORD=\n' >> "$temporary_file"; fi
if test "$found_md5" = false; then printf 'NAPCAT_QUICK_PASSWORD_MD5=%s\n' "$password_md5" >> "$temporary_file"; fi
unset password_md5
chmod 600 "$temporary_file"
mv "$temporary_file" .env
docker compose up -d --force-recreate --no-deps napcat
printf 'NapCat 快速登录凭据已更新，容器已重新创建。\n'