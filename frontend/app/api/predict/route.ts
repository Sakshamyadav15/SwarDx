import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_PREDICT_URL ?? "http://127.0.0.1:8000/predict"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 })
    }

    const forwardData = new FormData()
    forwardData.append("file", file, file.name)

    const backendRes = await fetch(BACKEND_URL, {
      method: "POST",
      body: forwardData,
      cache: "no-store",
    })

    const data = await backendRes.json()

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Inference failed" },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    )
  }
}
