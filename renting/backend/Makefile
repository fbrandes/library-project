.DEFAULT_GOAL := build
.PHONY: fmt vet build

test:
	mkdir -p build/cover
	go test ./... -coverprofile=build/cover/coverage.out

fmt: test
	go fmt ./..

vet: fmt
	go vet ./..

build: vet
	go build

cover: test
	mkdir build/report
	go tool cover -html=build/cover/coverage.out -o build/report/coverage.html

clean:
	rm -r build/
