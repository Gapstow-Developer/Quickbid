import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File size must be less than 5MB" }, { status: 400 })
    }

    console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

    // Get current settings to check for existing logo
    const settingsResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/settings`)
    const settingsData = await settingsResponse.json()
    const currentLogoUrl = settingsData?.data?.logo_url

    // If there's an existing logo, delete it from blob storage
    if (currentLogoUrl && currentLogoUrl.includes("blob.vercel-storage.com")) {
      try {
        const { del } = await import("@vercel/blob")
        await del(currentLogoUrl)
        console.log("Deleted old logo:", currentLogoUrl)
      } catch (deleteError) {
        console.warn("Could not delete old logo:", deleteError)
        // Continue with upload even if delete fails
      }
    }

    // Upload to Vercel Blob
    const blob = await put(`logos/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    console.log("File uploaded successfully:", blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: "Logo uploaded successfully",
    })
  } catch (error: any) {
    console.error("Logo upload error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload logo",
      },
      { status: 500 },
    )
  }
}
