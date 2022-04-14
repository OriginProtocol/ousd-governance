import { FunctionComponent } from "react";
import Wrapper from "components/Wrapper";

const Footer: FunctionComponent = () => (
  <footer className="footer footer-center p-4 bg-base-200 text-base-content">
    <Wrapper>
      <div className="w-full flex items-center justify-between">
        <ul className="flex space-x-4">
          <li>Jobs</li>
          <li>Docs</li>
          <li>Terms</li>
          <li>Privacy</li>
        </ul>
        <div className="flex space-x-4">
          <p>English</p>
          <p>Created by the team at Origin Protocol</p>
        </div>
      </div>
    </Wrapper>
  </footer>
);

export default Footer;
