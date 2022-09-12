export const SectionTitle = ({ children, noMarginBottom = false }) => (
  <div className={noMarginBottom ? "" : "mb-5"}>
    <h3 className="text-lg leading-6 font-medium">{children}</h3>
  </div>
);
