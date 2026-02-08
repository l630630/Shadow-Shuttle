package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"time"

	pb "github.com/shadow-shuttle/shadowd/grpc"
	"google.golang.org/grpc"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:50052", "shadowd gRPC address")
	tool := flag.String("tool", "wechat.send630", "tool name, e.g. wechat.send630")
	text := flag.String("text", "1", "text argument for wechat.send630")
	flag.Parse()

	conn, err := grpc.Dial(*addr, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("failed to connect to %s: %v", *addr, err)
	}
	defer conn.Close()

	client := pb.NewToolServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req := &pb.ToolRequest{
		ToolName: *tool,
		Args: map[string]string{
			"text": *text,
		},
	}

	fmt.Printf("Calling ExecuteTool on %s with tool=%s text=%s\n", *addr, *tool, *text)
	resp, err := client.ExecuteTool(ctx, req)
	if err != nil {
		log.Fatalf("ExecuteTool error: %v", err)
	}

	fmt.Printf("success: %v\n", resp.Success)
	if resp.Output != "" {
		fmt.Printf("output:\n%s\n", resp.Output)
	}
	if resp.Error != "" {
		fmt.Printf("error:\n%s\n", resp.Error)
	}
}

