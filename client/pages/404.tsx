import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import Wrapper from "components/Wrapper";
import Link from "components/Link";
import Seo from "components/Seo";

const NotFoundPage: NextPage = () => (
  <Wrapper narrow>
    <Seo title="404 - Page Not Found" />
    <PageTitle>404</PageTitle>
    <Card>
      <SectionTitle>Page Not Found</SectionTitle>
      <div className="space-y-4">
        <p>Use the links above to get to where you need to be.</p>
        <Link
          className="btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] btn-primary"
          href="/"
        >
          Or go to the home page
        </Link>
      </div>
    </Card>
  </Wrapper>
);

export default NotFoundPage;
