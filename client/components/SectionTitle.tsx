export const SectionTitle = ({ children, noMarginBottom = false }) => (
  <div className={noMarginBottom ? "" : "mb-5"}>
    <h3 className="text-xl font-header leading-6 font-medium text-white">
      {children}
    </h3>
  </div>
);
