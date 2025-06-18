export default function OAuthDebugPage() {
  // Get the current URL information
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"
  const googleCallbackUrl = `${baseUrl}/api/auth/callback/google`

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">OAuth Configuration URLs</h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Current Base URL:</h2>
            <code className="block p-3 bg-gray-100 rounded text-sm break-all">{baseUrl}</code>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Google OAuth Redirect URI:</h2>
            <code className="block p-3 bg-blue-50 rounded text-sm break-all border-2 border-blue-200">
              {googleCallbackUrl}
            </code>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Copy the "Google OAuth Redirect URI" above</li>
              <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
              <li>Click on your OAuth 2.0 Client ID</li>
              <li>Add the redirect URI to "Authorized redirect URIs"</li>
              <li>Save the changes</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Environment Variables Check:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>
                <strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || "Not set"}
              </p>
              <p>
                <strong>VERCEL_URL:</strong> {process.env.VERCEL_URL || "Not set"}
              </p>
              <p>
                <strong>GOOGLE_CLIENT_ID:</strong> {process.env.GOOGLE_CLIENT_ID ? "Set ✓" : "Not set ✗"}
              </p>
              <p>
                <strong>GOOGLE_CLIENT_SECRET:</strong> {process.env.GOOGLE_CLIENT_SECRET ? "Set ✓" : "Not set ✗"}
              </p>
              <p>
                <strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? "Set ✓" : "Not set ✗"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
