import type { NextPage } from "next";
import HoldingPage from "components/holding/Page";
import Layout from "components/layout";

const ClaimPage: NextPage = () => {
  return (
    <Layout hideNav>
      <HoldingPage />
    </Layout>
  );
};

export default ClaimPage;
