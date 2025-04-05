import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full py-4 mt-8 border-t border-border/40">
      <div className="container flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/zanjir-xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary transition-colors"
          >
            <Github className="h-4 w-4 ml-1" />
            GitHub
          </a>
          <a
            href="https://x.com/zanjir_xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary transition-colors"
          >
            <Twitter className="h-4 w-4 ml-1" />
            Twitter
          </a>
        </div>
        <div>
          ساخته شده با <span className="text-primary">₿</span> روی زنجیر
        </div>
      </div>
    </footer>
  )
}

