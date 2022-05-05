import { FunctionComponent } from "react";
import Wrapper from "components/Wrapper";

const Footer: FunctionComponent = () => (
  <footer className="footer footer-center py-6 bg-base-100 text-gray-400 text-xs">
    <Wrapper>
      <div className="w-full space-y-3 sm:space-y-0 sm:flex items-center justify-between">
        <ul className="flex space-x-5 lg:space-x-7">
          <li>Jobs</li>
          <li>Docs</li>
          <li>Terms</li>
          <li>Privacy</li>
        </ul>
        <div className="flex space-x-5 lg:space-x-7">
          <p>Created by the team at Origin Protocol</p>
        </div>
      </div>
    </Wrapper>
  </footer>
);

export default Footer;
