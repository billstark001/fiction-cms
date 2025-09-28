import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import Layout from '../components/layout/Layout';
import { useCreateSite } from '../hooks/useSites';
import { SiteEditorForm } from '../components/sites/SiteEditorForm';
import { ArrowLeftIcon } from '../components/icons';
import * as layoutStyles from '../components/layout/Layout.css';
import * as formStyles from '../styles/forms.css';
import * as pageStyles from '../styles/pages.css';
import type { CreateSiteRequest } from '../api/client';

export default function CreateSite() {
  const router = useRouter();
  const createSiteMutation = useCreateSite();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (payload: CreateSiteRequest) => {
    setFormError(null);
    createSiteMutation.reset();

    try {
      await createSiteMutation.mutateAsync(payload);
      router.navigate({ to: '/sites' });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create site');
    }
  };

  const handleCancel = () => {
    router.navigate({ to: '/sites' });
  };

  const mutationError =
    formError ??
    (createSiteMutation.error instanceof Error ? createSiteMutation.error.message : null);

  return (
    <Layout>
      <div className={layoutStyles.header}>
        <div>
          <button onClick={handleCancel} className={formStyles.backButton}>
            <ArrowLeftIcon />
            Back to Sites
          </button>
          <h1 className={layoutStyles.pageTitle}>Create New Site</h1>
          <p className={layoutStyles.pageDescription}>
            Configure a new site for content management
          </p>
        </div>
      </div>

      <div className={pageStyles.wideFormContainer}>
        <SiteEditorForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createSiteMutation.isPending}
          error={mutationError}
        />
      </div>
    </Layout>
  );
}