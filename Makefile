.PHONY: build run push

IMAGE_NAME=h-reg.nxbo.ir/labs/kiwi-swap
IMAGE_TAG=$(shell git rev-parse --short HEAD)

build:
	docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

run:
	docker run --rm -p 3000:3000 ${IMAGE_NAME}:${IMAGE_TAG}

push:
	docker push ${IMAGE_NAME}:${IMAGE_TAG}
