import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
  suffix?: boolean;
}

const appName = 'Fluxr';

export function PageTitle({ title, suffix = true }: PageTitleProps) {
  const fullTitle = suffix ? `${title} | ${appName}` : title;

  return (
    <Helmet>
      <title>{fullTitle}</title>
    </Helmet>
  );
}