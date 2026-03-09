import { Company } from '@jobsimplify/shared';
import MobileCompanyListItem from './MobileCompanyListItem';

interface MobileCompanyListProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
  onStatusMenuOpen: (company: Company) => void;
}

export default function MobileCompanyList({ companies, onCardClick, onStatusMenuOpen }: MobileCompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-sm text-gray-400">まだ企業が登録されていません</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {companies.map((company) => (
        <MobileCompanyListItem
          key={company.id}
          company={company}
          onClick={onCardClick}
          onStatusMenuOpen={onStatusMenuOpen}
        />
      ))}
    </div>
  );
}
