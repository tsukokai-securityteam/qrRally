#!/bin/bash
sudo docker exec -it qrserver certbot renew
sudo docker exec -it qrserver nginx -s reload
sudo docker exec -it qrserver pm2 restart apiserver