#!/bin/bash
sudo docker exec -it qrserver nginx -s stop
sudo docker exec -it qrserver pm2 stop apiserver