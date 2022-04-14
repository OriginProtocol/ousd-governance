import { FunctionComponent, ReactNode } from "react";
import Header from "components/Header";
import Footer from "components/Footer";
import Wrapper from "components/Wrapper";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FunctionComponent<LayoutProps> = ({ children }) => (
  <div className="min-h-screen">
    <Header />
    <div className="px-4 sm:px-6 md:px-8 py-12 mb-auto">
      <Wrapper>{children}</Wrapper>
    </div>
    <Footer />
  </div>
);

export default Layout;
