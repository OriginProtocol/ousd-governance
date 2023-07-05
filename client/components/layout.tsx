import { FunctionComponent, ReactNode } from "react";
import Header from "components/Header";
import Footer from "components/Footer";
import AdminUtils from "components/AdminUtils";

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const Layout: FunctionComponent<LayoutProps> = ({ children, hideNav }) => (
  <div className="min-h-screen">
    <Header hideNav={hideNav} />
    <div className="relative">
      <div className="bg-primary-content pt-4 pb-16 min-h-[15rem]">
        <div className="w-full h-80 bg-secondary absolute top-0 z-0" />
        <div className="relative z-5">{children}</div>
      </div>
    </div>
    <AdminUtils />
    <Footer />
  </div>
);

export default Layout;
