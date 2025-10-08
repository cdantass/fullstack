"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useLocation } from "react-router-dom";

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function BreadcrumbTopBar() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="text-white">
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = formatSegment(segment);

          return (
            <div key={href} className="flex items-center">
              {/* <ChevronRight size={20} strokeWidth={5} /> */}
              <BreadcrumbSeparator className="text-white" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-white">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="text-white">
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
