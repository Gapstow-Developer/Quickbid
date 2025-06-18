import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    return NextResponse.json({
      success: true,
      message: "Incomplete quote saved successfully",
      id: "temp-id",
      data: data,
      action: "created",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save incomplete quote",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: [],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch incomplete quotes",
      },
      { status: 500 },
    )
  }
}
