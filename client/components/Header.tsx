import { FunctionComponent } from "react";
import { Web3Button } from "components/Web3Button";
import Wrapper from "components/Wrapper";
import Link from "next/link";
import Image from "next/image";

const Header: FunctionComponent = () => (
  <header className="py-8 mb-2 shadow-lg bg-neutral text-neutral-content">
    <Wrapper>
      <div className="flex items-center justify-between">
        <div className="flex-none px-2 mx-2">
          <Link href="/" passHref>
            <a>
              <Image
                width="204"
                height="29"
                src="/logo.svg"
                alt="OUSD Governance"
              />
            </a>
          </Link>
        </div>
        <div className="flex-1 px-2 mx-2">
          <div className="items-stretch">
            <Link href="/proposal" passHref>
              <a className="btn btn-ghost btn-sm rounded-btn">Proposals</a>
            </Link>
            <Link href="/leaderboard" passHref>
              <a className="btn btn-ghost btn-sm rounded-btn">Leaderboard</a>
            </Link>
            <Link href="/vote-escrow" passHref>
              <a className="btn btn-ghost btn-sm rounded-btn">Vote Escrow</a>
            </Link>
          </div>
        </div>
        <div className="flex-none pr-4">
          <Web3Button />
        </div>
      </div>
    </Wrapper>
  </header>
);

export default Header;
