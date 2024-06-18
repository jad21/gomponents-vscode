package main

import "fmt"

func main() {
	fmt.Println(`
		<div>
			<h1>Hello, World!</h1>
			<p>This is a paragraph.</p>
		</div>
	`)

	// Go syntax highlighting should remain unaffected
	var x int = 10
	fmt.Println(x)

}
