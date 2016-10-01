docker run -i --rm --entrypoint sh \
  -e ROOT_DOMAIN=$3 \
  -e USERNAME=$4 \
  -e PASSWORD=$5 \
  -e ID=$6 \
  --name auto-add-dns-domeneshop \
  maccyber/auto-add-dns-domeneshop -c "/src/cli.js -i $1 -d $2"
