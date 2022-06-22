import { FunctionComponent } from "react";
import Wrapper from "components/Wrapper";

const Footer: FunctionComponent = () => (
  <footer className="footer footer-center py-6 bg-base-100 text-gray-400 text-xs">
    <Wrapper>
      <div className="w-full space-y-3 sm:space-y-0 sm:flex items-center justify-between">
        <ul className="flex space-x-5 lg:space-x-7">
          <li>
            <a
              className="text-gray-400 hover:text-black"
              href="https://analytics.ousd.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Analytics
            </a>
          </li>
          <li>
            <a
              className="text-gray-400 hover:text-black"
              href="https://angel.co/company/originprotocol/jobs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jobs
            </a>
          </li>
          <li>
            <a
              className="text-gray-400 hover:text-black"
              href="https://docs.ousd.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </li>
          <li>
            <a
              className="text-gray-400 hover:text-black"
              href="https://originprotocol.com/tos"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms
            </a>
          </li>
          <li>
            <a
              className="text-gray-400 hover:text-black"
              href="https://originprotocol.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
          </li>
          <li>
            <a
              className="text-gray-400 hover:text-black"
              href="https://discord.gg/jyxpUSe"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
          </li>
        </ul>
        <div className="flex space-x-5 lg:space-x-7">
          <a
            className="text-gray-400 hover:text-black"
            href="https://originprotocol.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <p>Created by the team at Origin Protocol</p>
          </a>
        </div>
      </div>
    </Wrapper>
  </footer>
);

export default Footer;