import { motion } from 'framer-motion';

interface NewsPersonnaliseeProps {
  context: string | null;
  title: string | null;
  body: string | null;
}

export const NewsPersonnalisee = ({ context, title, body }: NewsPersonnaliseeProps) => {
  if (!title || !body) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-6 mx-5 lg:mx-8 mt-4"
    >
      {context && (
        <p className="text-xs text-secondary font-medium uppercase tracking-wider">{context}</p>
      )}
      <h3 className="text-lg font-semibold text-foreground mt-2 leading-snug">{title}</h3>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{body}</p>
    </motion.div>
  );
};
