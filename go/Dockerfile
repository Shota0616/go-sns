FROM golang:1.22.4

WORKDIR /usr/src/app

RUN go build -o main cmd/api/main.go

# 開発中は変更を検知して再ビルドするために以下のコマンドを実行する
RUN go get github.com/githubnemo/CompileDaemon

CMD ["./main"]
