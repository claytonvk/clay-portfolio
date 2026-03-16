import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const logoData = readFileSync(
    join(process.cwd(), "public/images/logo-dark.png")
  );
  const base64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          borderRadius: "50%",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={base64} width={44} height={44} alt="CV" />
      </div>
    ),
    { ...size }
  );
}
