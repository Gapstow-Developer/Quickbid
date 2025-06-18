import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function DebugSessionPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(session, null, 2)}</pre>
      <div className="mt-4">
        <p>
          <strong>Session exists:</strong> {session ? "Yes" : "No"}
        </p>
        <p>
          <strong>User exists:</strong> {session?.user ? "Yes" : "No"}
        </p>
        <p>
          <strong>User name:</strong> {session?.user?.name || "undefined"}
        </p>
        <p>
          <strong>User email:</strong> {session?.user?.email || "undefined"}
        </p>
      </div>
    </div>
  )
}
