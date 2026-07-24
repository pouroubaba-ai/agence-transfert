import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const password = String(formData.get("password") || "").trim();

    if (!password) {
      return NextResponse.json(
        { error: "Password requis" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur avec son password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier le password
    const isValid = await bcrypt.compare(password, dbUser.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Password incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
