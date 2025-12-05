import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="text-2xl font-bold text-primary">
                    自主學習系統
                </Link>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">登入</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">註冊</Link>
                    </Button>
                </div>
            </div>
        </nav>
    )
}
