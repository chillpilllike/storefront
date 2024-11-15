import Image from "next/image";
import Script from "next/script"; // Import Script for external scripts
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { ChannelsListDocument, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export async function Footer({ channel }: { channel: string }) {
  const footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
    variables: { slug: "footer", channel },
    revalidate: 60 * 60 * 24,
  });
  const channels = process.env.SALEOR_APP_TOKEN
    ? await executeGraphQL(ChannelsListDocument, {
        withAuth: false, // disable cookie-based auth for this call
        headers: {
          // and use app token instead
          Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
        },
      })
    : null;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-neutral-300 bg-neutral-50">
      {/* TrustBox External Script */}
      <Script
        type="text/javascript"
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        async
      />

      {/* Reamaze External Script */}
      <Script
        type="text/javascript"
        async
        src="https://cdn.reamaze.com/assets/reamaze-loader.js"
      />

      {/* Reamaze Widget Configuration */}
      <Script
        id="reamaze-config"
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `
            var _support = _support || { 'ui': {}, 'user': {} };
            _support['account'] = 'secretgreen2';
            _support['ui']['contactMode'] = 'default';
            _support['ui']['enableKb'] = 'true';
            _support['ui']['styles'] = {
              widgetColor: 'rgba(16, 162, 197, 1)',
              gradient: true,
            };
            _support['ui']['shoutboxFacesMode'] = 'default';
            _support['ui']['shoutboxHeaderLogo'] = true;
            _support['ui']['widget'] = {
              displayOn: 'all',
              fontSize: 'default',
              allowBotProcessing: true,
              slug: 'secretgreen-chat-slash-contact-form-shoutbox',
              label: {
                text: 'Let us know if you have any questions! 😊',
                mode: "notification",
                delay: 3,
                duration: 30,
                primary: 'I have a question',
                secondary: 'No, thanks',
                sound: true,
              },
              position: 'bottom-right',
              mobilePosition: 'bottom-right'
            };
            _support['apps'] = {
              faq: { "enabled": true },
              recentConversations: {},
              orders: {},
              shopper: {}
            };
          `,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-3 gap-8 py-16">
          {footerLinks.menu?.items?.map((item) => {
            return (
              <div key={item.id}>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {item.name}
                </h3>
                <ul className="mt-4 space-y-4 [&>li]:text-neutral-500">
                  {item.children?.map((child) => {
                    if (child.category) {
                      return (
                        <li key={child.id} className="text-sm">
                          <LinkWithChannel href={`/categories/${child.category.slug}`}>
                            {child.category.name}
                          </LinkWithChannel>
                        </li>
                      );
                    }
                    if (child.collection) {
                      return (
                        <li key={child.id} className="text-sm">
                          <LinkWithChannel href={`/collections/${child.collection.slug}`}>
                            {child.collection.name}
                          </LinkWithChannel>
                        </li>
                      );
                    }
                    if (child.page) {
                      return (
                        <li key={child.id} className="text-sm">
                          <LinkWithChannel href={`/pages/${child.page.slug}`}>
                            {child.page.title}
                          </LinkWithChannel>
                        </li>
                      );
                    }
                    if (child.url) {
                      return (
                        <li key={child.id} className="text-sm">
                          <LinkWithChannel href={child.url}>{child.name}</LinkWithChannel>
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* TrustBox Widget - Micro Review Count */}
        <div
          className="trustpilot-widget"
          data-locale="en-US"
          data-template-id="5419b6a8b0d04a076446a9ad"
          data-businessunit-id="63abde420cd64197d7e1c9fa"
          data-style-height="24px"
          data-style-width="100%"
          data-min-review-count="0"
          data-style-alignment="center"
          style={{ textAlign: "center", margin: "20px 0" }}
        >
          <a
            href="https://www.trustpilot.com/review/secretgreen.com.au"
            target="_blank"
            rel="noopener"
          >
            Trustpilot
          </a>
        </div>

        {channels?.channels && (
          <div className="mb-4 text-neutral-500">
            <label>
              <span className="text-sm">Change currency:</span>{" "}
              <ChannelSelect channels={channels.channels} />
            </label>
          </div>
        )}

        <div className="flex flex-col justify-between border-t border-neutral-200 py-10 sm:flex-row">
          <p className="text-sm text-neutral-500">
            Copyright &copy; {currentYear} secretgreen.com.au.
          </p>
          <p className="flex gap-1 text-sm text-neutral-500">
            Secure & Encrypted Payments{" "}
          </p>
        </div>
      </div>
    </footer>
  );
}
