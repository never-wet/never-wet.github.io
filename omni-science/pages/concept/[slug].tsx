import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../../components/Layout";
import ConceptView from "../../components/ConceptView";
import { useStore } from "../../lib/store";
import { scienceDatabase } from "../../data/scienceDatabase";
import Head from "next/head";

export default function ConceptPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { setCurrentConcept, currentConcept } = useStore();

  useEffect(() => {
    if (slug) {
      setCurrentConcept(slug as string);
    }
  }, [slug]);

  if (!currentConcept && slug) {
    // Basic fallback if concept not found
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-slate-500">
          Concept not found.
        </div>
      </Layout>
    );
  }

  if (!currentConcept) return null;

  return (
    <Layout>
      <Head>
        <title>{currentConcept.title} | Omni-Science</title>
      </Head>
      <ConceptView concept={currentConcept} />
    </Layout>
  );
}
