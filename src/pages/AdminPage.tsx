import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating traceId
import {
    getAdminDashboardDataAPI,
    getAdminChallengeDataAPI,
    AdminDashboardDataResponse, // Import response type
    AdminChallengeDataResponse, // Import response type
} from '@/services/firebaseApi';
import logger from '@/lib/logger'; // Import logger

// Import Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge"; // For game status
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

// Removed local placeholder types

const AdminPage: React.FC = () => {
    // Use imported types for state
    const [dashboardData, setDashboardData] = useState<AdminDashboardDataResponse | null>(null);
    const [challengeData, setChallengeData] = useState<AdminChallengeDataResponse[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to format date string
    const formatDate = (dateString: string) => {
        try {
            // Handle potential invalid date strings gracefully
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? dateString : date.toLocaleString();
        } catch (e) {
            return dateString; // Return original if parsing fails
        }
    };

    const fetchData = async () => {
        // No need to set isLoading(true) here if called within useEffect or interval
        // setError(null); // Reset error only if necessary (e.g., manual refresh button)
        const traceId = uuidv4();
        logger.info(`[${traceId}] AdminPage: Fetching data...`);

        try {
            // Call actual API functions concurrently
            const [dashData, chalData] = await Promise.all([
                getAdminDashboardDataAPI({ traceId }),
                getAdminChallengeDataAPI({ traceId })
            ]);

            setDashboardData(dashData);
            setChallengeData(chalData);
            setError(null); // Clear error on successful fetch
        } catch (err) {
            logger.error(`[${traceId}] AdminPage: Error fetching admin data:`, err);
            setError(err instanceof Error ? err.message : 'Failed to fetch admin data.');
            // Optionally clear data on error? Or keep stale data?
            // setDashboardData(null);
            // setChallengeData(null);
        } finally {
            // Set loading to false only after the first fetch completes
            if (isLoading) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        setIsLoading(true); // Set loading true on initial mount
        fetchData(); // Initial fetch

        // Set up periodic refresh (e.g., every 60 seconds)
        const intervalId = setInterval(fetchData, 60000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

    // Helper function to render KPI value or placeholder
    const renderKpiValue = (value: number | null | undefined, unit: string = '', precision: number = 1) => {
        if (value === null || value === undefined) return <span className="text-muted-foreground">N/A</span>; // Use muted-foreground
        // Handle potential NaN values if calculations fail
        if (isNaN(value)) return <span className="text-muted-foreground">Error</span>;
        return `${value.toFixed(precision)}${unit}`;
    };

    // Loading Skeleton Structure
    const renderSkeleton = () => (
        <div className="space-y-6">
             {/* KPI Skeletons */}
             <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(6)].map((_, i) => ( // Assuming 6 KPIs
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-2/3" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
             {/* Active Games Skeleton */}
             <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(3)].map((_, i) => ( // Show 3 skeleton rows
                                    <TableRow key={i}>
                                        {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             {/* Challenges Skeleton */}
             <div className="mt-6">
                 <Skeleton className="h-6 w-32 mb-4" />
                 <Card>
                     <CardContent className="p-4 space-y-2">
                         {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                     </CardContent>
                 </Card>
             </div>
        </div>
    );


    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {error && <p className="text-red-600 bg-red-100 p-4 rounded-md mb-6">Error: {error}</p>}

            {isLoading ? renderSkeleton() : (
                <>
                    {dashboardData && (
                        <div className="space-y-6">
                            {/* KPIs Section */}
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Overview & KPIs</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Existing KPIs */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Active Games</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{dashboardData.totalActiveGames ?? <span className="text-muted-foreground">N/A</span>}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Players in Active Games</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{dashboardData.totalPlayersInActiveGames ?? <span className="text-muted-foreground">N/A</span>}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Avg Players / Game</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{renderKpiValue(dashboardData.kpis?.averagePlayersPerGame)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Avg Game Duration</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{renderKpiValue(dashboardData.kpis?.averageGameDurationMinutes, ' min')}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Avg Round Duration</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{renderKpiValue(dashboardData.kpis?.averageRoundDurationSeconds, ' sec', 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Joker Usage Rate</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{renderKpiValue(dashboardData.kpis?.jokerUsageRatePercent, '%', 0)}</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                             {/* Top Songs Section */}
                             {dashboardData.kpis?.topOverallSongs && dashboardData.kpis.topOverallSongs.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Top Nominated Songs (Overall)</h2>
                                    <Card>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Rank</TableHead>
                                                        <TableHead>Track</TableHead>
                                                        <TableHead>Artist</TableHead>
                                                        <TableHead className="text-right">Nominations</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dashboardData.kpis.topOverallSongs.map((song, index) => (
                                                        <TableRow key={song.trackId}>
                                                            <TableCell>{index + 1}</TableCell>
                                                            <TableCell className="font-medium">{song.title}</TableCell>
                                                            <TableCell>{song.artist}</TableCell>
                                                            <TableCell className="text-right">{song.nominationCount}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}


                            {/* Active Games Section */}
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Active Games ({dashboardData.totalActiveGames ?? 0})</h2>
                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Game ID</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Players</TableHead>
                                                    <TableHead>Round</TableHead>
                                                    <TableHead>Created At</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dashboardData.activeGames && dashboardData.activeGames.length > 0 ? (
                                                    dashboardData.activeGames.map((game) => (
                                                        <TableRow key={game.gameId}>
                                                            <TableCell className="font-medium">{game.gameId}</TableCell>
                                                            <TableCell><Badge variant={game.status === 'lobby' ? 'secondary' : 'default'}>{game.status}</Badge></TableCell>
                                                            <TableCell>{game.playerCount}</TableCell>
                                                            <TableCell>{game.currentRound}</TableCell>
                                                            <TableCell>{formatDate(game.createdAt)}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-24 text-center">
                                                            No active games found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {challengeData && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-4">Challenges</h2>
                            <Card>
                                <CardContent className="p-4">
                                    <Accordion type="single" collapsible className="w-full">
                                        {challengeData.length > 0 ? (
                                            challengeData.map((challenge) => (
                                                <AccordionItem value={challenge.id} key={challenge.id}>
                                                    <AccordionTrigger>{challenge.text}</AccordionTrigger>
                                                    <AccordionContent>
                                                        {challenge.predefinedSongs && challenge.predefinedSongs.length > 0 ? (
                                                            <>
                                                                <h4 className="text-sm font-semibold mb-2">Predefined Songs:</h4>
                                                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                                                    {challenge.predefinedSongs.map((song) => (
                                                                        <li key={song.trackId}>
                                                                            {song.title} - {song.artist} (ID: {song.trackId})
                                                                            {/* TODO: Add play button for previewUrl if available */}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No predefined songs for this challenge.</p>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted-foreground">No challenges found.</p>
                                        )}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {!dashboardData && !challengeData && !isLoading && (
                         <p className="text-center text-muted-foreground mt-6">No admin data available.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPage;