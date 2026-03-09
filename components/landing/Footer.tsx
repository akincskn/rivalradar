export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} RivalRadar. All rights reserved.</p>
          <p className="text-xs">
            AI-generated content is for informational purposes only. Verify before making decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
