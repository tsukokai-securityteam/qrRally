#!/bin/bash
sudo docker exec -it qrserver certbot renew
sudo docker exec -it qrserver service nginx start
sudo docker exec -it qrserver pm2 start /apiserver/pm2_apiserver.yml