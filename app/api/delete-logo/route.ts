import { NextResponse } from "next/server"
import { del } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, message: "No URL provided" }, { status: 400 })
    }

    // Only delete if it's a Vercel blob URL
    if (!url.includes("blob.vercel-storage.com")) {
      return NextResponse.json({ success: false, message: "Invalid blob URL" }, { status: 400 })
    }

    console.log("Deleting logo from blob storage:", url)

    // Delete from Vercel Blob
    await del(url)

    console.log("Logo deleted successfully from blob storage")

    return NextResponse.json({
      success: true,
      message: "Logo deleted successfully",
    })
  } catch (error: any) {
    console.error("Logo deletion error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete logo",
      },
      { status: 500 },
    )
  }
}
