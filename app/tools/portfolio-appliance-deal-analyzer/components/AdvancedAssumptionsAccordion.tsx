import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
    title: string;
    children: React.ReactNode;
}

export function AdvancedAssumptionsAccordion({ title, children }: Props) {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-none bg-slate-50 rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:no-underline py-3">
                    {title}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
