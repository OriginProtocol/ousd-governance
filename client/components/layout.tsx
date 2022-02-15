import { Web3Button } from "components/Web3Button";

export default function Layout({ children }: JSX.ElementChildrenAttribute) {
  return (
    <div className="max-w-7xl mx-auto md:pt-10 md:px-6">
      <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content md:rounded-box">
        <div className="flex-none px-2 mx-2">
          <span className="text-lg font-bold">OUSD</span>
        </div>
        <div className="flex-1 px-2 mx-2">
          <div className="items-stretch">
            <a href="/" className="btn btn-ghost btn-sm rounded-btn">
              Overview
            </a>
            <a href="/proposal" className="btn btn-ghost btn-sm rounded-btn">
              Proposals
            </a>
            <a href="/leaderboard" className="btn btn-ghost btn-sm rounded-btn">
              Leaderboard
            </a>
          </div>
        </div>
        <div className="flex-none pr-4">
          <Web3Button />
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-8 py-12">{children}</div>
      {/*
      <footer className="p-10 footer bg-neutral text-neutral-content">
        <div>
          <span className="footer-title">Services</span>
          <a className="link link-hover">Branding</a>
          <a className="link link-hover">Design</a>
          <a className="link link-hover">Marketing</a>
          <a className="link link-hover">Advertisement</a>
        </div>
        <div>
          <span className="footer-title">Company</span>
          <a className="link link-hover">About us</a>
          <a className="link link-hover">Contact</a>
          <a className="link link-hover">Jobs</a>
          <a className="link link-hover">Press kit</a>
        </div>
        <div>
          <span className="footer-title">Legal</span>
          <a className="link link-hover">Terms of use</a>
          <a className="link link-hover">Privacy policy</a>
          <a className="link link-hover">Cookie policy</a>
        </div>
      </footer>
      */}
    </div>
  );
}
