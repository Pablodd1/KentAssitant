import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
                <h1 className="text-6xl font-bold">
                    American Wellness <span className="text-blue-600">MD Assistant</span>
                </h1>
                <p className="mt-3 text-2xl">
                    Advanced Clinical Reasoning & Documentation System
                </p>

                <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
                    <Link
                        href="/cases"
                        className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
                    >
                        <h3 className="text-2xl font-bold">Manage Cases &rarr;</h3>
                        <p className="mt-4 text-xl">
                            Upload data, record voice, and generate clinical intelligence reports.
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}
