import type { Metadata } from "next"
import QuotesClientPage from "./QuotesClientPage"

export const metadata: Metadata = {
  title: "Quotes - Window Cleaning Calculator",
  description: "View and manage submitted quotes from your window cleaning calculator",
}

interface QuotesPageProps {
  searchParams: {
    status?: string
  }
}

export default function QuotesPage(props: QuotesPageProps) {
  return <QuotesClientPage {...props} />
}
