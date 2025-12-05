import fs from "fs/promises";
import path from "path";
import Markdown from "react-markdown";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function TermsOfServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "TermsOfServicePage" });
  const backText = t("back", { default: "Back" });

  const filePath = path.join(process.cwd(), "src/content", `terms-of-service-${locale}.md`);
  let content = "";
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (e) {
    console.error(e);
    content = "# Error\nCould not load content.";
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
             <ArrowLeft className="h-4 w-4" />
             {backText}
           </Link>
           <LanguageSwitcher />
        </div>
        <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
          <Markdown>{content}</Markdown>
        </article>
      </div>
    </div>
  );
}
